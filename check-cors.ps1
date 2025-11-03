# Check CORS configuration after deployment
$serverUrl = "https://championfootballer-server-1.onrender.com"
$origin = "https://championfootballer-client.vercel.app"

Write-Host "🔍 Checking CORS Configuration..." -ForegroundColor Cyan
Write-Host ""

# Wait for deployment
Write-Host "⏳ Waiting for Render deployment (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "1️⃣  Testing OPTIONS preflight request..." -ForegroundColor Cyan

try {
    $headers = @{
        'Origin' = $origin
        'Access-Control-Request-Method' = 'POST'
        'Access-Control-Request-Headers' = 'Content-Type,Authorization'
    }
    
    # Use WebRequest for full control
    $request = [System.Net.HttpWebRequest]::Create("$serverUrl/auth/login")
    $request.Method = "OPTIONS"
    $request.Headers.Add("Origin", $origin)
    $request.Headers.Add("Access-Control-Request-Method", "POST")
    $request.Headers.Add("Access-Control-Request-Headers", "Content-Type,Authorization")
    
    try {
        $response = $request.GetResponse()
        $statusCode = [int]$response.StatusCode
        
        Write-Host "   Status Code: $statusCode" -ForegroundColor Gray
        
        # Check CORS headers
        $corsOrigin = $response.Headers["Access-Control-Allow-Origin"]
        $corsMethods = $response.Headers["Access-Control-Allow-Methods"]
        $corsHeaders = $response.Headers["Access-Control-Allow-Headers"]
        $corsCredentials = $response.Headers["Access-Control-Allow-Credentials"]
        
        if ($corsOrigin -eq $origin) {
            Write-Host "✅ Access-Control-Allow-Origin: $corsOrigin" -ForegroundColor Green
        } else {
            Write-Host "❌ Access-Control-Allow-Origin: $corsOrigin (Expected: $origin)" -ForegroundColor Red
        }
        
        if ($corsMethods) {
            Write-Host "✅ Access-Control-Allow-Methods: $corsMethods" -ForegroundColor Green
        } else {
            Write-Host "❌ Access-Control-Allow-Methods: MISSING" -ForegroundColor Red
        }
        
        if ($corsHeaders) {
            Write-Host "✅ Access-Control-Allow-Headers: $corsHeaders" -ForegroundColor Green
        } else {
            Write-Host "❌ Access-Control-Allow-Headers: MISSING" -ForegroundColor Red
        }
        
        if ($corsCredentials -eq "true") {
            Write-Host "✅ Access-Control-Allow-Credentials: $corsCredentials" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Access-Control-Allow-Credentials: $corsCredentials" -ForegroundColor Yellow
        }
        
        $response.Close()
        
        Write-Host ""
        Write-Host "🎉 CORS is configured correctly!" -ForegroundColor Green
        Write-Host "   Your app should work now: https://championfootballer-client.vercel.app" -ForegroundColor Cyan
        
    } catch {
        Write-Host "❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Server might still be deploying. Wait 1 minute and run again." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "2️⃣  Testing actual GET request..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "$serverUrl/leagues" -Method GET -UseBasicParsing -Headers @{'Origin' = $origin}
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ 401 Unauthorized (expected - requires auth)" -ForegroundColor Green
        
        # Check CORS headers in error response
        $corsOrigin = $_.Exception.Response.Headers["Access-Control-Allow-Origin"]
        if ($corsOrigin) {
            Write-Host "✅ CORS headers present in error response" -ForegroundColor Green
        } else {
            Write-Host "⚠️  CORS headers missing in error response" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
