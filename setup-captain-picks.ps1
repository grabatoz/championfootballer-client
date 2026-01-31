# Run this script to setup captain picks feature

Write-Host "🔧 Step 1: Building TypeScript backend..." -ForegroundColor Cyan
cd championfootballerserver
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend build successful!" -ForegroundColor Green
    
    Write-Host "`n🗄️  Step 2: Running SQL migration..." -ForegroundColor Cyan
    Write-Host "Please run this SQL in your PostgreSQL database:" -ForegroundColor Yellow
    Write-Host @"
    
ALTER TABLE "Matches" ADD COLUMN IF NOT EXISTS "homeDefensiveImpactId" UUID;
ALTER TABLE "Matches" ADD COLUMN IF NOT EXISTS "homeMentalityId" UUID;
ALTER TABLE "Matches" ADD COLUMN IF NOT EXISTS "awayDefensiveImpactId" UUID;
ALTER TABLE "Matches" ADD COLUMN IF NOT EXISTS "awayMentalityId" UUID;

ALTER TABLE "Matches" ADD CONSTRAINT "fk_home_defensive_impact" 
  FOREIGN KEY ("homeDefensiveImpactId") REFERENCES "Users"(id) ON DELETE SET NULL;
  
ALTER TABLE "Matches" ADD CONSTRAINT "fk_home_mentality" 
  FOREIGN KEY ("homeMentalityId") REFERENCES "Users"(id) ON DELETE SET NULL;
  
ALTER TABLE "Matches" ADD CONSTRAINT "fk_away_defensive_impact" 
  FOREIGN KEY ("awayDefensiveImpactId") REFERENCES "Users"(id) ON DELETE SET NULL;
  
ALTER TABLE "Matches" ADD CONSTRAINT "fk_away_mentality" 
  FOREIGN KEY ("awayMentalityId") REFERENCES "Users"(id) ON DELETE SET NULL;
"@ -ForegroundColor White
    
    Write-Host "`n📝 Or run the SQL file:" -ForegroundColor Yellow
    Write-Host "psql -U your_username -d your_database -f add-captain-picks-columns.sql" -ForegroundColor White
    
    Write-Host "`n🚀 Step 3: Restart backend server..." -ForegroundColor Cyan
    Write-Host "npm run dev" -ForegroundColor White
    
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
}
