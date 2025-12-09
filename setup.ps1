# Payout System Setup Script
# This script automates the database setup process

Write-Host "🚀 Payout System Setup" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker Desktop..." -ForegroundColor Yellow
try {
    $dockerCheck = docker ps 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker Desktop is not running!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please:" -ForegroundColor Yellow
        Write-Host "1. Open Docker Desktop application" -ForegroundColor White
        Write-Host "2. Wait for it to fully start" -ForegroundColor White
        Write-Host "3. Run this script again" -ForegroundColor White
        Write-Host ""
        exit 1
    }
    Write-Host "✅ Docker Desktop is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Desktop is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Starting MySQL database..." -ForegroundColor Yellow
docker-compose up -d mysql

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start MySQL container" -ForegroundColor Red
    exit 1
}

Write-Host "✅ MySQL container started" -ForegroundColor Green
Write-Host "Waiting for MySQL to be ready..." -ForegroundColor Yellow

# Wait for MySQL to be ready
$maxAttempts = 30
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts -and -not $ready) {
    Start-Sleep -Seconds 2
    $attempt++
    try {
        $result = docker exec mypay-mock-system-mysql-1 mysqladmin ping -h localhost --silent 2>&1
        if ($LASTEXITCODE -eq 0) {
            $ready = $true
        }
    } catch {
        # Continue waiting
    }
    Write-Host "." -NoNewline -ForegroundColor Gray
}

Write-Host ""
if ($ready) {
    Write-Host "✅ MySQL is ready" -ForegroundColor Green
} else {
    Write-Host "⚠️  MySQL may still be starting. Continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Running database migrations..." -ForegroundColor Yellow
npm run prisma:migrate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Migrations completed" -ForegroundColor Green
Write-Host ""
Write-Host "Seeding database..." -ForegroundColor Yellow
npm run prisma:seed

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Seeding failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start API server: npm run start:api" -ForegroundColor White
Write-Host "2. Start Worker (in another terminal): npm run start:worker" -ForegroundColor White
Write-Host "3. Test: curl http://localhost:3000/health" -ForegroundColor White
Write-Host ""

