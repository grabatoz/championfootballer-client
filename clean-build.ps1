param(
  [string]$DistDir = ".next-build"
)

$ErrorActionPreference = "Stop"

# Detect risky path with spaces (can trigger Windows file locks during build)
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
if ($projectPath -match " ") {
  Write-Host "⚠ Folder path has spaces: $projectPath" -ForegroundColor Yellow
  Write-Host "  Recommended: Move project to a path without spaces (e.g., F:\\TechSolutionOR\\championfootballer-client) or exclude folder from antivirus." -ForegroundColor Yellow
}

Push-Location $projectPath
try {
  Write-Host "🧹 Cleaning previous build folders..." -ForegroundColor Cyan
  $folders = @(".next", $DistDir)
  foreach ($f in $folders) {
    if (Test-Path $f) {
      try {
        Remove-Item -Path $f -Recurse -Force -ErrorAction Stop
        Write-Host "  Removed $f" -ForegroundColor Green
      } catch {
        Write-Host "  Could not remove $f (locked). Retrying with attrib reset..." -ForegroundColor Yellow
        cmd /c "attrib -r -s -h `"$f`" /s /d" | Out-Null
        Start-Sleep -Milliseconds 200
        Remove-Item -Path $f -Recurse -Force -ErrorAction SilentlyContinue
      }
    }
  }

  Write-Host "🏗️ Building with distDir=$DistDir..." -ForegroundColor Cyan
  $env:NEXT_DIST_DIR = $DistDir
  yarn build
} finally {
  Pop-Location
}
