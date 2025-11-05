# Champion Footballer - Quick Setup & Optimization Script

Write-Host "🚀 Champion Footballer - Optimization Setup" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Check Node version
Write-Host "📦 Checking Node.js version..." -ForegroundColor Cyan
$nodeVersion = node --version
Write-Host "Node version: $nodeVersion" -ForegroundColor Yellow

if ($nodeVersion -notmatch "v(1[8-9]|[2-9][0-9])\.") {
    Write-Host "⚠️  Warning: Node.js 18+ recommended for best performance" -ForegroundColor Red
}

Write-Host ""
Write-Host "📥 Installing frontend dependencies..." -ForegroundColor Cyan
npm install

Write-Host ""
Write-Host "📥 Installing backend dependencies..." -ForegroundColor Cyan
Set-Location api
npm install
Set-Location ..

Write-Host ""
Write-Host "🔍 Running type check..." -ForegroundColor Cyan
npm run type-check

Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Start frontend: npm run dev" -ForegroundColor White
Write-Host "  2. Start backend: cd api && npm run dev" -ForegroundColor White
Write-Host "  3. Build for production: npm run build" -ForegroundColor White
Write-Host "  4. Analyze bundle: ANALYZE=true npm run build" -ForegroundColor White
Write-Host ""
Write-Host "📖 See OPTIMIZATION-APPLIED.md for complete guide" -ForegroundColor Cyan
Write-Host ""
