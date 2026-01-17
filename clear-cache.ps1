# Clear Next.js cache and restart dev server
Write-Host "🧹 Clearing Next.js cache..." -ForegroundColor Cyan

# Stop any running Next.js dev servers
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like '*next*' } | Stop-Process -Force -ErrorAction SilentlyContinue

# Clear .next directory
if (Test-Path ".next") {
    Write-Host "Removing .next directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
}

# Clear node_modules/.cache
if (Test-Path "node_modules/.cache") {
    Write-Host "Removing node_modules cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue
}

# Clear browser cache instruction
Write-Host ""
Write-Host "✅ Cache cleared!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Clear your browser cache (Ctrl + Shift + Delete)" -ForegroundColor White
Write-Host "2. Run: npm run dev" -ForegroundColor White
Write-Host "3. Hard refresh in browser (Ctrl + Shift + R)" -ForegroundColor White
Write-Host ""
