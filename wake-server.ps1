# Wake up Render server and test CORS
$serverUrl = "https://championfootballer-server-1.onrender.com"

Write-Host "🔄 Waking up Render server..." -ForegroundColor Yellow
Write-Host ""

# 1. Ping health endpoint
Write-Host "1️⃣  Testing /health endpoint..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$serverUrl/health" -Method GET -TimeoutSec 60
    Write-Host "✅ Health: $($health.status)" -ForegroundColor Green
    Write-Host "   Timestamp: $($health.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "⏳ Server is spinning up... wait 30s and try again" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 2. Test CORS with OPTIONS preflight
Write-Host "2️⃣  Testing CORS (OPTIONS preflight)..." -ForegroundColor Cyan
try {
    $headers = @{
        'Origin' = 'https://championfootballer-client.vercel.app'
        'Access-Control-Request-Method' = 'POST'
        'Access-Control-Request-Headers' = 'Content-Type,Authorization'
    }
    
    $response = Invoke-WebRequest -Uri "$serverUrl/auth/login" -Method OPTIONS -Headers $headers -UseBasicParsing
    
    $corsOrigin = $response.Headers['Access-Control-Allow-Origin']
    $corsMethods = $response.Headers['Access-Control-Allow-Methods']
    $corsHeaders = $response.Headers['Access-Control-Allow-Headers']
    
    if ($corsOrigin) {
        Write-Host "✅ CORS Origin: $corsOrigin" -ForegroundColor Green
    } else {
        Write-Host "❌ CORS Origin header missing!" -ForegroundColor Red
    }
    
    if ($corsMethods) {
        Write-Host "✅ CORS Methods: $corsMethods" -ForegroundColor Green
    }
    
    if ($corsHeaders) {
        Write-Host "✅ CORS Headers: $corsHeaders" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ CORS test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 3. Test actual endpoints
Write-Host "3️⃣  Testing /leagues endpoint (with auth)..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$serverUrl/leagues" -Method GET -UseBasicParsing
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    
    # Check for CORS headers in GET response
    if ($response.Headers['Access-Control-Allow-Origin']) {
        Write-Host "✅ CORS headers present in GET response" -ForegroundColor Green
    } else {
        Write-Host "⚠️  CORS headers missing in GET response" -ForegroundColor Yellow
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ 401 Unauthorized (expected - auth required)" -ForegroundColor Green
    } else {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Server is awake and ready!" -ForegroundColor Green
Write-Host "   You can now use the app: https://championfootballer-client.vercel.app" -ForegroundColor Cyan
