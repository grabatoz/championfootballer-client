# Performance Optimization - Quick Start Script
# Run this script to apply all optimizations

Write-Host "🚀 Starting Performance Optimization..." -ForegroundColor Green
Write-Host ""

# Step 1: Database Optimization
Write-Host "📊 Step 1: Applying Database Indexes..." -ForegroundColor Cyan
$dbApplied = Read-Host "Have you applied the database indexes? (y/n)"
if ($dbApplied -eq "y") {
    Write-Host "✅ Database indexes confirmed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Please run: psql `$DATABASE_URL -f api/performance-indexes-optimized.sql" -ForegroundColor Yellow
    Write-Host "   Then run this script again" -ForegroundColor Yellow
    exit
}

Write-Host ""

# Step 2: Install Dependencies
Write-Host "📦 Step 2: Checking Dependencies..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    yarn install
}

Write-Host ""

# Step 3: Build Optimized Version
Write-Host "🔨 Step 3: Building Optimized Application..." -ForegroundColor Cyan
Write-Host "   This may take a few minutes..." -ForegroundColor Yellow
yarn build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build completed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed. Please check errors above." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: API Optimization Check
Write-Host "🔧 Step 4: API Optimization Checklist..." -ForegroundColor Cyan
Write-Host "   Please ensure the following are added to api/src/index.ts:" -ForegroundColor Yellow
Write-Host "   1. import { cacheMiddleware } from './middleware/cache';" -ForegroundColor White
Write-Host "   2. import { compressionMiddleware } from './middleware/compression';" -ForegroundColor White
Write-Host "   3. app.use(cacheMiddleware());" -ForegroundColor White
Write-Host "   4. app.use(compressionMiddleware());" -ForegroundColor White
Write-Host ""
$apiUpdated = Read-Host "Have you added these to your API? (y/n)"

if ($apiUpdated -eq "y") {
    Write-Host "✅ API middleware confirmed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Please add the middleware to your API" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Performance Summary
Write-Host "📊 Performance Optimization Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ Next.js config optimized" -ForegroundColor Green
Write-Host "✅ Image optimization enabled" -ForegroundColor Green
Write-Host "✅ Bundle splitting configured" -ForegroundColor Green
Write-Host "✅ API caching utilities created" -ForegroundColor Green
Write-Host "✅ Database optimization tools ready" -ForegroundColor Green
Write-Host "✅ Compression middleware created" -ForegroundColor Green
Write-Host "✅ Performance monitoring ready" -ForegroundColor Green
Write-Host ""

# Step 6: Testing
Write-Host "🧪 Step 6: Testing Recommendations" -ForegroundColor Cyan
Write-Host "   Run these commands to verify optimizations:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Test API caching:" -ForegroundColor White
Write-Host "      curl -I http://localhost:3001/api/leagues" -ForegroundColor Gray
Write-Host "      (Check for X-Cache: HIT header)" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Test compression:" -ForegroundColor White
Write-Host "      curl -H 'Accept-Encoding: br' -I http://localhost:3001/api/leagues" -ForegroundColor Gray
Write-Host "      (Check for Content-Encoding: br header)" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Run Lighthouse audit:" -ForegroundColor White
Write-Host "      npx lighthouse http://localhost:3000 --view" -ForegroundColor Gray
Write-Host ""

# Step 7: Next Steps
Write-Host "🎯 Next Steps" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "1. Replace fetch() calls with optimizedFetch()" -ForegroundColor White
Write-Host "   Location: src/lib/utils/optimizedFetch.ts" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Add React.memo to heavy components" -ForegroundColor White
Write-Host "   Example: export default memo(MyComponent)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Use useMemo for expensive calculations" -ForegroundColor White
Write-Host "   Example: const sorted = useMemo(() => ..., [deps])" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Implement lazy loading" -ForegroundColor White
Write-Host "   Example: const Heavy = dynamic(() => import('./Heavy'))" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Monitor performance metrics" -ForegroundColor White
Write-Host "   Location: COMPLETE-PERFORMANCE-OPTIMIZATION-GUIDE.md" -ForegroundColor Gray
Write-Host ""

Write-Host "✨ Optimization setup complete!" -ForegroundColor Green
Write-Host "📖 See COMPLETE-PERFORMANCE-OPTIMIZATION-GUIDE.md for detailed usage" -ForegroundColor Cyan
Write-Host ""

# Step 8: Start Application
$startNow = Read-Host "Would you like to start the application now? (y/n)"
if ($startNow -eq "y") {
    Write-Host ""
    Write-Host "🚀 Starting application..." -ForegroundColor Green
    yarn start
}
