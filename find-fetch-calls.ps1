# 🔍 Find and Fix Direct fetch() Calls
# This script helps identify components using direct fetch() instead of optimized client

Write-Host "🔍 Scanning for direct fetch() calls..." -ForegroundColor Cyan
Write-Host ""

# Search for fetch calls in components
$fetchCalls = Select-String -Path "src\**\*.tsx", "src\**\*.ts" -Pattern "fetch\(" -Exclude "*httpClient.ts", "*api-fast.ts", "*api.ts"

$count = 0
$files = @{}

foreach ($match in $fetchCalls) {
    $file = $match.Path
    $line = $match.LineNumber
    $content = $match.Line.Trim()
    
    if (-not $files.ContainsKey($file)) {
        $files[$file] = @()
    }
    
    $files[$file] += @{
        Line = $line
        Content = $content
    }
    
    $count++
}

Write-Host "📊 Found $count direct fetch() calls in $($files.Count) files" -ForegroundColor Yellow
Write-Host ""

if ($count -gt 0) {
    Write-Host "🔧 Files that need optimization:" -ForegroundColor Red
    Write-Host ""
    
    foreach ($file in $files.Keys | Sort-Object) {
        Write-Host "  📄 $file" -ForegroundColor White
        foreach ($match in $files[$file]) {
            Write-Host "     Line $($match.Line): $($match.Content)" -ForegroundColor Gray
        }
        Write-Host ""
    }
    
    Write-Host "💡 To fix these:" -ForegroundColor Green
    Write-Host ""
    Write-Host "1. Import optimized client:" -ForegroundColor White
    Write-Host "   import { fetchJSON, batchRequests } from '@/lib/httpClient';" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Replace fetch() with fetchJSON():" -ForegroundColor White
    Write-Host "   // Before" -ForegroundColor Gray
    Write-Host "   const response = await fetch('/api/matches');" -ForegroundColor Gray
    Write-Host "   const data = await response.json();" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   // After" -ForegroundColor Gray
    Write-Host "   const data = await fetchJSON('/matches');" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. For multiple requests, use batchRequests():" -ForegroundColor White
    Write-Host "   const [leagues, matches] = await batchRequests([" -ForegroundColor Gray
    Write-Host "     { endpoint: '/leagues' }," -ForegroundColor Gray
    Write-Host "     { endpoint: '/matches' }" -ForegroundColor Gray
    Write-Host "   ]);" -ForegroundColor Gray
    Write-Host ""
    
} else {
    Write-Host "✅ All components are using optimized API client!" -ForegroundColor Green
    Write-Host ""
}

Write-Host "🎯 Performance Tips:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Always use api-fast.ts functions (leagueAPI, matchAPI, etc.)" -ForegroundColor White
Write-Host "2. Batch parallel requests with batchRequests()" -ForegroundColor White
Write-Host "3. Check Performance Monitor in bottom-right (dev mode)" -ForegroundColor White
Write-Host "4. Target: Average request time <300ms" -ForegroundColor White
Write-Host ""

# Check if api-fast is being used
Write-Host "🔍 Checking api-fast.ts usage..." -ForegroundColor Cyan
$apiFastUsage = Select-String -Path "src\**\*.tsx", "src\**\*.ts" -Pattern "from '@/lib/api-fast'" -Exclude "*api-fast.ts"

if ($apiFastUsage) {
    Write-Host "✅ Found $($apiFastUsage.Count) files using api-fast.ts" -ForegroundColor Green
} else {
    Write-Host "⚠️  No files are importing from api-fast.ts" -ForegroundColor Yellow
    Write-Host "💡 Consider using api-fast.ts for all API calls" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📈 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm run dev" -ForegroundColor White
Write-Host "2. Check Performance Monitor (bottom-right)" -ForegroundColor White
Write-Host "3. Replace any fetch() calls found above" -ForegroundColor White
Write-Host "4. Verify average request time <300ms" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
