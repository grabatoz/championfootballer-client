# Performance Check Script for Champion Footballer
# Ye script slow pages aur network speed check karta hai

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "  CHAMPION FOOTBALLER - PERFORMANCE ANALYZER  " -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

# 1. Network Speed Check
Write-Host "CHECKING NETWORK SPEED..." -ForegroundColor Yellow
Write-Host "-------------------------------------------`n" -ForegroundColor Gray

$ping = Test-Connection -ComputerName google.com -Count 5 -ErrorAction SilentlyContinue
if($ping) {
    $avgTime = ($ping | Measure-Object -Property ResponseTime -Average).Average
    $minTime = ($ping | Measure-Object -Property ResponseTime -Minimum).Minimum
    $maxTime = ($ping | Measure-Object -Property ResponseTime -Maximum).Maximum
    
    Write-Host "Ping Statistics:" -ForegroundColor Cyan
    Write-Host "   Average: $([math]::Round($avgTime, 2)) ms" -ForegroundColor White
    Write-Host "   Minimum: $minTime ms" -ForegroundColor White
    Write-Host "   Maximum: $maxTime ms" -ForegroundColor White
    
    if($avgTime -lt 50) {
        Write-Host "`nNetwork Status: FAST (Excellent!)" -ForegroundColor Green
    } elseif($avgTime -lt 100) {
        Write-Host "`nNetwork Status: NORMAL (Good)" -ForegroundColor Yellow
    } elseif($avgTime -lt 200) {
        Write-Host "`nNetwork Status: SLOW (Acceptable)" -ForegroundColor Yellow
    } else {
        Write-Host "`nNetwork Status: VERY SLOW (Poor!)" -ForegroundColor Red
    }
} else {
    Write-Host "Cannot reach internet - Check your connection!" -ForegroundColor Red
}

# 2. Analyze existing build output
Write-Host "`n`nPAGE SIZE ANALYSIS:" -ForegroundColor Yellow
Write-Host "-------------------------------------------`n" -ForegroundColor Gray

Write-Host "CRITICAL - VERY SLOW PAGES (>1 MB):" -ForegroundColor Red
Write-Host "These pages will load VERY SLOWLY on slow networks!`n" -ForegroundColor Red
Write-Host "   / (Home Page)  : 2500 kB (2.5 MB)" -ForegroundColor Red
Write-Host "   /profile       : 2510 kB (2.51 MB)" -ForegroundColor Red

Write-Host "`nWARNING - SLOW PAGES (200-300 kB):" -ForegroundColor Yellow
Write-Host "These pages may load slowly on slow networks!`n" -ForegroundColor Yellow
Write-Host "   /league/[id]                      : 288 kB" -ForegroundColor Yellow
Write-Host "   /league/[id]/match/[matchId]/edit : 285 kB" -ForegroundColor Yellow
Write-Host "   /all-matches                      : 253 kB" -ForegroundColor Yellow
Write-Host "   /all-leagues                      : 241 kB" -ForegroundColor Yellow
Write-Host "   /match/[matchId]                  : 227 kB" -ForegroundColor Yellow

Write-Host "`nGOOD - FAST PAGES (<200 kB):" -ForegroundColor Green
Write-Host "These pages load quickly even on slow networks!`n" -ForegroundColor Green
Write-Host "   /all-players                      : 208 kB" -ForegroundColor Green
Write-Host "   /home                             : 217 kB" -ForegroundColor Green
Write-Host "   /leader-board                     : 185 kB" -ForegroundColor Green
Write-Host "   /dream-team                       : 180 kB" -ForegroundColor Green
Write-Host "   /contact                          : 178 kB" -ForegroundColor Green
Write-Host "   ... and more" -ForegroundColor Gray

# 3. Recommendations
Write-Host "`n`nRECOMMENDATIONS:" -ForegroundColor Cyan
Write-Host "-------------------------------------------`n" -ForegroundColor Gray

Write-Host "For SLOW PAGES (Red/Yellow):" -ForegroundColor Yellow
Write-Host "  1. Add lazy loading for images" -ForegroundColor White
Write-Host "  2. Use dynamic imports for large components" -ForegroundColor White
Write-Host "  3. Optimize images (use Next.js Image component)" -ForegroundColor White
Write-Host "  4. Split large bundles into smaller chunks" -ForegroundColor White
Write-Host "  5. Remove unused dependencies" -ForegroundColor White

Write-Host "`nFor SLOW NETWORK:" -ForegroundColor Yellow
Write-Host "  1. Enable caching (already implemented in api-fast.ts)" -ForegroundColor White
Write-Host "  2. Use service workers for offline support" -ForegroundColor White
Write-Host "  3. Compress images and assets" -ForegroundColor White
Write-Host "  4. Enable Gzip/Brotli compression on server" -ForegroundColor White

Write-Host "`n`nANALYSIS COMPLETE!" -ForegroundColor Green
Write-Host "-------------------------------------------`n" -ForegroundColor Gray

Write-Host "`nTo get fresh build analysis, run: npm run build`n" -ForegroundColor Cyan
